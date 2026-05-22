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
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.department_name && user.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'ready' && user.load_status === 'Ready') ||
                (statusFilter === 'sibuk' && user.load_status === 'Sibuk');
            return matchesDept && matchesSearch && matchesStatus;
        });
    }, [userWorkloads, selectedDeptId, searchQuery, statusFilter]);

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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 select-none">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Penyelesaian Renewal</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{renewalCompletionRate}%</div>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase mt-1">Laju Penyelesaian</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tugas Pending</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/10">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{totalPendingTasks}</div>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase mt-1">Dokumen Menunggu</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Direview & Revisi</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/10">
                            <Layers className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{totalActiveReviews}</div>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase mt-1">Proses Aktif</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PIC Legal Sibuk</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/10">
                            <Briefcase className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{busyPicsCount}</div>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase mt-1">Beban Tinggi</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                    <Card>
                        <CardHeader className="p-5 pb-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider">Beban Pengerjaan Per Divisi</CardTitle>
                            <p className="text-muted-foreground text-[9px] font-medium mt-0.5">Distribusi kontrak aktif yang sedang ditangani oleh tiap divisi.</p>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[240px] w-full select-none">
                                {isMounted && departmentWorkload.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={departmentWorkload}
                                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
                                            <XAxis dataKey="department" fontSize={8} stroke="rgba(120, 120, 120, 0.6)" tickLine={false} axisLine={false} />
                                            <YAxis fontSize={8} stroke="rgba(120, 120, 120, 0.6)" tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '10px',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                height={30}
                                                iconSize={8}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="active_reviews" stackId="w" name="Review & Revisi" fill="#6366f1" barSize={14} />
                                            <Bar dataKey="pending_approvals" stackId="w" name="Persetujuan Pending" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={14} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 opacity-30 text-center justify-center h-full">
                                        <Activity size={32} />
                                        <p className="text-[10px] font-bold uppercase">Data tidak tersedia</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Trafik Alur Kategori</CardTitle>
                                <p className="text-muted-foreground text-[9px] font-medium mt-0.5">Kontrak Masuk (Review) vs Keluar (Selesai)</p>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold">
                                <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground uppercase">Masuk</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground uppercase">Keluar</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5">
                            {categoryTraffic.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground font-medium uppercase italic">Belum ada data trafik</div>
                            ) : (
                                categoryTraffic.map((item, idx) => {
                                    const total = item.incoming_count + item.outgoing_count;
                                    const inPct = total > 0 ? (item.incoming_count / total) * 100 : 0;
                                    const outPct = total > 0 ? (item.outgoing_count / total) * 100 : 0;
                                    return (
                                        <div key={idx} className="space-y-1.5 group">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-foreground truncate max-w-[160px]">{item.category_name}</span>
                                                <div className="flex items-center gap-2 shrink-0 font-bold text-[9px] tabular-nums">
                                                    <span className="text-amber-500 flex items-center gap-0.5"><ArrowDownLeft size={10} />{item.incoming_count}</span>
                                                    <span className="text-muted-foreground/30">|</span>
                                                    <span className="text-emerald-500 flex items-center gap-0.5"><ArrowUpRight size={10} />{item.outgoing_count}</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden flex border border-border/10">
                                                {item.incoming_count > 0 && (
                                                    <div style={{ width: `${inPct}%` }} className="h-full bg-amber-500" />
                                                )}
                                                {item.outgoing_count > 0 && (
                                                    <div style={{ width: `${outPct}%` }} className="h-full bg-emerald-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border/40 bg-card/40 p-3 rounded-xl">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                                <Input
                                    placeholder="Cari nama, peran, divisi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 pl-8 text-xs bg-background"
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
                                className={cn("h-8 px-3 font-bold gap-1.5", statusFilter === 'ready' ? "bg-emerald-600 hover:bg-emerald-700 border-none" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50")}
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full", statusFilter === 'ready' ? "bg-white" : "bg-emerald-500")} />
                                Ready
                            </Button>
                            <Button
                                variant={statusFilter === 'sibuk' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('sibuk')}
                                className={cn("h-8 px-3 font-bold gap-1.5", statusFilter === 'sibuk' ? "bg-rose-600 hover:bg-rose-700 border-none" : "text-rose-600 border-rose-200 hover:bg-rose-50")}
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusFilter === 'sibuk' ? "bg-white" : "bg-rose-500")} />
                                Sibuk
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                        {filteredWorkloads.length === 0 ? (
                            <Card className="col-span-2 border-dashed flex flex-col items-center justify-center py-10 opacity-60">
                                <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-wider">PIC tidak ditemukan</p>
                            </Card>
                        ) : (
                            filteredWorkloads.map((user) => {
                                const activeCount = user.active_contracts_count;
                                const capacityPct = Math.min((activeCount / 5) * 100, 100);
                                const isBusy = user.load_status === 'Sibuk';
                                const customAvatarStyle = user.bg_color && user.text_color ? { backgroundColor: user.bg_color, color: user.text_color } : undefined;
                                return (
                                    <Card key={user.id} className={cn("group transition-all hover:shadow-md", isBusy && "border-rose-200 dark:border-rose-900/40")}>
                                        <CardContent className="p-4 flex flex-col justify-between h-full">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div style={customAvatarStyle} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-black/5 dark:border-white/5 shrink-0", !customAvatarStyle && "bg-muted text-muted-foreground")}>
                                                            {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-[11px] font-bold block truncate leading-tight">{user.name}</span>
                                                            <span className="text-muted-foreground text-[9px] font-medium truncate block mt-0.5">{user.position || user.role}</span>
                                                        </div>
                                                    </div>
                                                    <Badge variant={isBusy ? "destructive" : "secondary"} className={cn("text-[8px] font-bold uppercase px-2 shrink-0 h-4", !isBusy && "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 hover:bg-emerald-500/10")}>
                                                        {user.load_status}
                                                    </Badge>
                                                </div>
                                                <div className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg w-max max-w-full truncate">
                                                    {user.department_name || 'Direksi & Staff Umum'}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                                        <span>Kapasitas Kerja</span>
                                                        <span className={cn(isBusy ? "text-rose-600" : "text-emerald-600")}>{activeCount} / 5 Kontrak</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/5">
                                                        <div style={{ width: `${capacityPct}%` }} className={cn("h-full transition-all duration-500", isBusy ? "bg-rose-500" : "bg-emerald-500")} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-border/10 pt-3 mt-3">
                                                <div className="flex flex-col text-[9px] font-medium text-muted-foreground">
                                                    <span>Inisiasi: <strong className="text-foreground">{user.initiated_contracts_count || 0}</strong></span>
                                                    <span>Pending: <strong className="text-amber-600">{user.pending_tasks_count || 0}</strong></span>
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
