import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Input } from '@/components/ui/inputs/Input';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Briefcase, Calendar, Clock, Filter, Layers, MessageSquare, Send, UserCheck, X } from 'lucide-react';
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

    const [selectedChatUser, setSelectedChatUser] = useState<UserWorkload | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Record<string, Array<{ sender: 'me' | 'them'; text: string; time: string }>>>({});

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

    const handleOpenChat = (user: UserWorkload) => {
        setSelectedChatUser(user);
        if (!chatHistory[user.id]) {
            setChatHistory((prev) => ({
                ...prev,
                [user.id]: [
                    {
                        sender: 'them',
                        text: `Halo! Saya PIC/Legal untuk beberapa kontrak Anda. Ada yang bisa saya bantu terkait persetujuan atau revisi kontrak?`,
                        time: '10:30',
                    },
                ],
            }));
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !selectedChatUser) return;
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const newMessage = { sender: 'me' as const, text: chatMessage, time };
        setChatHistory((prev) => ({
            ...prev,
            [selectedChatUser.id]: [...(prev[selectedChatUser.id] || []), newMessage],
        }));
        setChatMessage('');
        setTimeout(() => {
            const replies = [
                `Baik, pesan Anda telah saya terima. Saya sedang meninjau kontrak aktif dan akan segera memperbarui status alur persetujuannya.`,
                `Tentu, revisi pasal tersebut sedang kami diskusikan dengan divisi terkait. Saya hubungi kembali setelah draf siap.`,
                `Siap! Saya prioritaskan pengerjaan dokumen ini hari ini agar bisa segera disetujui oleh Direktur.`,
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setChatHistory((prev) => ({
                ...prev,
                [selectedChatUser.id]: [...(prev[selectedChatUser.id] || []), { sender: 'them', text: randomReply, time: replyTime }],
            }));
        }, 1200);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 select-none md:grid-cols-2 lg:grid-cols-4">
                <MetricItem label="Total Kontrak Diproses" value={totalInProcessThisMonth} icon={Layers} color="text-primary" />
                <MetricItem label="Kontrak Pending" value={totalPendingThisMonth} icon={Clock} color="text-warning" />
                <MetricItem label="Kontrak Dikerjakan" value={totalActiveThisMonth} icon={Briefcase} color="text-cyan-500" />
                <MetricItem label="Total Kontrak Selesai" value={totalCompletedThisMonth} icon={UserCheck} color="text-success" />
            </div>

            <div className="space-y-4 lg:col-span-1">
                <div className="flex flex-col items-stretch justify-between gap-3 p-3 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-col items-stretch gap-2 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <SearchInput
                                placeholder="Cari nama, peran, divisi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-background h-9"
                            />
                        </div>
                        <div className="relative shrink-0">
                            <select
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                disabled={!isAdmin}
                                className="bg-background border-input focus:ring-primary h-9 w-full cursor-pointer appearance-none rounded-lg border pr-8 pl-3 text-xs font-medium outline-none focus:ring-1 disabled:opacity-75 md:w-auto"
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
                            <Filter size={10} className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2" />
                        </div>
                    </div>
                </div>
                <div className="grid max-h-[580px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredWorkloads.length === 0 ? (
                        <Card className="col-span-full flex flex-col items-center justify-center border-dashed py-10 opacity-60">
                            <Briefcase className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-text-desc text-xs font-medium  uppercase">PIC tidak ditemukan</p>
                        </Card>
                    ) : (
                        filteredWorkloads.map((user) => {
                            const activeCount = user.active_contracts_count;
                            const capacityPct = Math.min((activeCount / 5) * 100, 100);
                            const isBusy = user.load_status === 'Sibuk';
                            const customAvatarStyle =
                                user.bg_color && user.text_color ? { backgroundColor: user.bg_color, color: user.text_color } : undefined;
                            return (
                                <Card
                                    key={user.id}
                                    className={cn('group transition-all hover:shadow-md', isBusy && 'border-danger/20 dark:border-danger/40')}
                                >
                                    <CardContent className="flex h-full flex-col justify-between p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div
                                                        style={customAvatarStyle}
                                                        className={cn(
                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 text-[10px] font-medium dark:border-white/5',
                                                            !customAvatarStyle && 'bg-surface-muted text-text-desc',
                                                        )}
                                                    >
                                                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-text-main block truncate text-[11px] leading-tight font-medium">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-text-desc mt-0.5 block truncate text-[9px] font-semibold">
                                                            {user.position || user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenChat(user)}
                                                    className="border-surface-border/60 h-7 gap-1.5 px-3 text-[9px] font-semibold shadow-sm"
                                                >
                                                    <MessageSquare size={10} /> DISKUSI
                                                </Button>
                                            </div>
                                            <div className="text-text-desc bg-surface-muted/50 w-max max-w-full truncate rounded-lg px-2 py-1 text-[9px] font-medium">
                                                {user.department_name || 'Direksi & Staff Umum'}
                                            </div>

                                            <div className="bg-surface-muted/30 border-surface-border/40 rounded-lg border p-3">
                                                <div className="border-surface-border/40 mb-3 flex items-center gap-1.5 border-b pb-2">
                                                    <Calendar size={10} className="text-primary opacity-60" />
                                                    <span className="text-text-desc text-[9px] font-semibold tracking-widest uppercase">
                                                        Aktivitas Bulan Ini
                                                    </span>
                                                </div>
                                                <div className="divide-surface-border/40 grid grid-cols-3 gap-2 divide-x text-center">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-text-soft text-[9px] font-semibold  uppercase">
                                                            Menunggu
                                                        </span>
                                                        <span className="text-warning text-sm font-semibold">
                                                            {user.stats_this_month?.pending || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-text-soft text-[9px] leading-tight font-semibold  uppercase">
                                                            Dikerjakan
                                                        </span>
                                                        <span className="text-primary text-sm font-semibold">
                                                            {user.stats_this_month?.active || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-text-soft text-[9px] font-semibold  uppercase">
                                                            Selesai
                                                        </span>
                                                        <span className="text-success text-sm font-semibold">
                                                            {user.stats_this_month?.completed || 0}
                                                        </span>
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
                <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-200">
                    <Card className="animate-in zoom-in-95 flex max-h-[500px] w-full max-w-md flex-col overflow-hidden shadow-2xl duration-200">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0 border-b p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    style={
                                        selectedChatUser.bg_color && selectedChatUser.text_color
                                            ? { backgroundColor: selectedChatUser.bg_color, color: selectedChatUser.text_color }
                                            : undefined
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/5 text-[10px] font-medium dark:border-white/5"
                                >
                                    {selectedChatUser.initials ?? selectedChatUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-xs leading-none font-medium">{selectedChatUser.name}</CardTitle>
                                    <p className="text-muted-foreground mt-1 text-[9px] font-medium">
                                        {selectedChatUser.position || selectedChatUser.role}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedChatUser(null)} className="h-8 w-8">
                                <X size={14} />
                            </Button>
                        </CardHeader>
                        <CardContent className="bg-muted/5 min-h-[220px] flex-1 space-y-3 overflow-y-auto p-4">
                            {chatHistory[selectedChatUser.id]?.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex max-w-[80%] flex-col rounded-lg px-3 py-2 text-xs',
                                        msg.sender === 'me'
                                            ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none shadow-sm'
                                            : 'dark:bg-muted text-foreground border-border/10 mr-auto rounded-tl-none border bg-white',
                                    )}
                                >
                                    <p className="font-medium">{msg.text}</p>
                                    <span className={cn('mt-1 block text-right text-[8px] opacity-70')}>{msg.time}</span>
                                </div>
                            ))}
                        </CardContent>
                        <form onSubmit={handleSendMessage} className="bg-background flex gap-2 border-t p-3">
                            <Input
                                placeholder={`Kirim pesan...`}
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                className="h-9 text-xs"
                            />
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
