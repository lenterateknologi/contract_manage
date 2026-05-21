import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Briefcase,
    MessageSquare,
    Search,
    Filter,
    Send,
    Mail,
    X,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserWorkload, CategoryTraffic } from './types';

export function WorkloadMonitoring() {
    const { auth, departments = [] } = usePage<any>().props;
    const userDeptId = auth?.user?.department_id;
    const loginUserRole = auth?.user?.role;

    const { userWorkloads = [], categoryTraffic = [] } = usePage().props.metrics as unknown as {
        userWorkloads: UserWorkload[];
        categoryTraffic: CategoryTraffic[];
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
    const [selectedDeptId, setSelectedDeptId] = useState<string>(userDeptId || 'all');
    const [selectedChatUser, setSelectedChatUser] = useState<UserWorkload | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Record<string, Array<{ sender: 'me' | 'them'; text: string; time: string }>>>({});
    const [systemAlert, setSystemAlert] = useState<string | null>(null);

    // Filter workloads
    const filteredWorkloads = userWorkloads.filter(user => {
        // Filter by division/department
        const matchesDept = selectedDeptId === 'all' || user.department_id === selectedDeptId;

        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.department_name && user.department_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'ready' && user.load_status === 'Ready') ||
            (statusFilter === 'sibuk' && user.load_status === 'Sibuk');

        return matchesDept && matchesSearch && matchesStatus;
    });

    const handleOpenChat = (user: UserWorkload) => {
        setSelectedChatUser(user);
        // Initialize mock chat history if empty
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

        // Mock auto reply after 1.5 seconds
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
        }, 1500);
    };

    return (
        <div className="space-y-8 select-none animate-in fade-in duration-500 pb-10">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-foreground text-lg font-extrabold tracking-tight flex items-center gap-2">
                        <Briefcase className="text-primary" size={20} />
                        Informasi Per Divisi
                    </h2>
                    <p className="text-muted-foreground text-xs font-medium mt-1">
                        Analisis beban pengerjaan draf kontrak oleh Staff Legal / PIC dan volume trafik alur dokumen.
                    </p>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left side: Category Traffic (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                        <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5 dark:border-slate-800/40">
                            <div>
                                <h3 className="text-foreground text-sm font-bold tracking-tight">Trafik Alur Kategori</h3>
                                <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Kontrak Masuk (Review) vs Keluar (Selesai)</p>
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground">Masuk</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">Keluar</span>
                                </div>
                            </div>
                        </div>

                        {/* Traffic list */}
                        <div className="space-y-4">
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
                                        <div key={idx} className="space-y-2 group">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-foreground truncate max-w-[200px]" title={item.category_name}>
                                                    {item.category_name}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0 font-extrabold text-[10px]">
                                                    <span className="text-amber-500 flex items-center gap-0.5">
                                                        <ArrowDownLeft size={12} />
                                                        {item.incoming_count}
                                                    </span>
                                                    <span className="text-muted-foreground/30">|</span>
                                                    <span className="text-emerald-500 flex items-center gap-0.5">
                                                        <ArrowUpRight size={12} />
                                                        {item.outgoing_count}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Beautiful custom dual bar */}
                                            <div className="h-2.5 w-full bg-muted/40 rounded-full overflow-hidden flex border border-border/20">
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
                                                {total === 0 && (
                                                    <div className="h-full w-full bg-muted/20" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: PIC Capacity & Workload Board (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Control Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border/40 bg-card/25 backdrop-blur-md p-3.5 rounded-2xl dark:border-slate-800/60">
                        {/* Search & Division Filter */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-2.5 text-muted-foreground" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, peran, divisi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-muted/40 border border-border/30 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium"
                                
                                />
                            </div>

                            {/* Division Dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={selectedDeptId}
                                    onChange={(e) => setSelectedDeptId(e.target.value)}
                                    disabled={loginUserRole !== 'Admin'}
                                    className="w-full md:w-auto pl-3 pr-8 py-1.5 text-xs bg-muted/40 border border-border/30 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-semibold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed appearance-none"
                                >
                                    {loginUserRole === 'Admin' && (
                                        <option value="all" className="bg-card text-foreground font-medium">Semua Divisi</option>
                                    )}
                                    {departments.map((dept: any) => {
                                        if (loginUserRole !== 'Admin' && dept.id !== userDeptId) {
                                            return null;
                                        }
                                        return (
                                            <option key={dept.id} value={dept.id} className="bg-card text-foreground font-medium">
                                                {dept.name}
                                            </option>
                                        );
                                    })}
                                    {loginUserRole !== 'Admin' && !userDeptId && (
                                        <option value="all" className="bg-card text-foreground font-medium">Semua Divisi</option>
                                    )}
                                </select>
                                <span className="absolute right-2.5 top-2.5 pointer-events-none text-muted-foreground">
                                    <Filter size={11} className="opacity-60" />
                                </span>
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-200 cursor-pointer border",
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
                                    "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-200 cursor-pointer border flex items-center gap-1",
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
                                    "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-200 cursor-pointer border flex items-center gap-1",
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredWorkloads.length === 0 ? (
                            <div className="col-span-2 text-center py-10 border border-dashed border-border/60 rounded-2xl bg-card/20 text-xs font-semibold text-muted-foreground">
                                Tidak ada staff PIC yang sesuai filter.
                            </div>
                        ) : (
                            filteredWorkloads.map((user) => {
                                const activeCount = user.active_contracts_count;
                                // Visual capacity: max normal is 5, percentage is (activeCount / 5) * 100, capped at 100
                                const capacityPct = Math.min((activeCount / 5) * 100, 100);
                                const isBusy = user.load_status === 'Sibuk';

                                const customAvatarStyle = user.bg_color && user.text_color
                                    ? { backgroundColor: user.bg_color, color: user.text_color }
                                    : undefined;

                                return (
                                    <div
                                        key={user.id}
                                        className={cn(
                                            "border bg-card/35 hover:bg-card/50 rounded-2xl p-4.5 transition-all duration-300 backdrop-blur-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5",
                                            isBusy ? "border-rose-500/30 dark:border-rose-500/15" : "border-border/60 dark:border-slate-800/60"
                                        )}
                                    >
                                        <div className="space-y-3.5">
                                            {/* Header card: User info & load status */}
                                            <div className="flex items-start justify-between min-w-0 gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        style={customAvatarStyle}
                                                        className={cn(
                                                            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-extrabold border border-black/5 dark:border-white/5 shrink-0",
                                                            !customAvatarStyle && "bg-muted text-muted-foreground"
                                                        )}
                                                    >
                                                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-foreground text-[12.5px] font-bold block truncate leading-snug">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-muted-foreground text-[10px] font-semibold truncate block mt-0.5">
                                                            {user.position || user.role}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Load Status Badge */}
                                                <span className={cn(
                                                    "text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 border",
                                                    isBusy
                                                        ? "bg-rose-500/10 text-rose-600 border-rose-500/10 dark:text-rose-400"
                                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 dark:text-emerald-400"
                                                )}>
                                                    {user.load_status}
                                                </span>
                                            </div>

                                            {/* Department Tag */}
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg w-max max-w-full">
                                                <span className="truncate">{user.department_name || 'Direksi & Staff Umum'}</span>
                                            </div>

                                            {/* Capacity and Stats */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                                    <span>Kapasitas Kerja</span>
                                                    <span className={cn(isBusy ? "text-rose-500" : "text-emerald-500", "font-extrabold")}>
                                                        {activeCount} / 5 Kontrak
                                                    </span>
                                                </div>
                                                {/* Capacity progress bar */}
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

                                        {/* Action: Initiate Contract or Chat */}
                                        <div className="flex items-center justify-between border-t border-border/20 pt-3 mt-4 gap-2 dark:border-slate-800/30">
                                            <span className="text-[10px] font-medium text-muted-foreground">
                                                Inisiasi: <strong className="text-foreground font-bold">{user.initiated_contracts_count}</strong>
                                            </span>

                                            <button
                                                onClick={() => handleOpenChat(user)}
                                                className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/10 transition-all duration-200 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                                            >
                                                <MessageSquare size={11} />
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

            {/* Chat Drawer / Popover Modal */}
            {selectedChatUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-card border border-border/60 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[500px]">
                        {/* Drawer Header */}
                        <div className="bg-muted/40 border-b border-border/40 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    style={selectedChatUser.bg_color && selectedChatUser.text_color ? { backgroundColor: selectedChatUser.bg_color, color: selectedChatUser.text_color } : undefined}
                                    className="h-8.5 w-8.5 rounded-full flex items-center justify-center text-xs font-bold border border-black/5 dark:border-white/5"
                                >
                                    {selectedChatUser.initials ?? selectedChatUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-foreground text-xs font-extrabold leading-tight">{selectedChatUser.name}</h4>
                                    <span className="text-muted-foreground text-[10px] font-semibold">{selectedChatUser.position || selectedChatUser.role}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedChatUser(null)}
                                className="h-7 w-7 rounded-lg hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Chat History */}
                        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[220px] bg-slate-50/20 dark:bg-slate-950/10">
                            {chatHistory[selectedChatUser.id]?.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex flex-col max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-normal",
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

                        {/* Send Form */}
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
                                className="h-8.5 w-8.5 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                            >
                                <Send size={13} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
