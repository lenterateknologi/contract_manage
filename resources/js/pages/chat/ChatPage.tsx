import { AppSidebar } from '@/layouts/app/components/AppSidebar';
import { AppSidebarHeader } from '@/layouts/app/components/AppSidebarHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/navigation/Sidebar';
import { Head, usePage, usePoll } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Building2, Calendar, ExternalLink, FileText, MessageSquare, Search, X, Info, Users, Paperclip } from 'lucide-react';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import ContractChat from '@/pages/contracts/components/tabs/ContractChat';
import { Contract } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { ContractListItem } from './ui/ContractListItem';
import { ChatRightPanel } from './ui/ChatRightPanel';
import { ToastProvider } from '@/components/ui/feedback/Toast';

interface Props {
    contracts: Contract[];
    initialContractId?: string;
    breadcrumbs: any[];
}

export default function ChatPage({ contracts: initialContracts, initialContractId, breadcrumbs }: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState('');
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedContractId, setSelectedContractId] = useState<string | null>(initialContractId || null);

    // Manage local contracts state to reflect new messages immediately
    const [contracts, setContracts] = useState(initialContracts);

    // ponytail: usePoll to fetch real-time updates for the involved contracts every 4 seconds
    usePoll(4000, { only: ['contracts'] });

    // Sync local contracts state when initialContracts updates via polling
    useEffect(() => {
        setContracts(initialContracts);
    }, [initialContracts]);

    // ponytail: mark contract chat as read on select, update URL state without full page reload
    useEffect(() => {
        if (selectedContractId) {
            contractApi.messages.markRead(selectedContractId).catch(console.error);
            setContracts((prev) =>
                prev.map((c) => (c.id === selectedContractId ? { ...c, unread_count: 0 } : c))
            );
            const newUrl = `/admin/chat/${selectedContractId}`;
            if (window.location.pathname !== newUrl) {
                window.history.pushState({}, '', newUrl);
            }
        } else {
            const defaultUrl = '/admin/chat';
            if (window.location.pathname !== defaultUrl) {
                window.history.pushState({}, '', defaultUrl);
            }
        }
    }, [selectedContractId]);

    // Memoize filtered contracts (Search text & Date range) sorted by latest updated_at first
    const filteredContracts = useMemo(() => {
        return contracts
            .filter((c) => {
                if (search) {
                    const s = search.toLowerCase();
                    const matchesSearch =
                        c.title.toLowerCase().includes(s) ||
                        c.form_no?.toLowerCase().includes(s) ||
                        c.contract_no?.toLowerCase().includes(s);
                    if (!matchesSearch) return false;
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                return dateB - dateA;
            });
    }, [contracts, search]);

    const selectedContract = useMemo(() => {
        return contracts.find(c => c.id === selectedContractId) || null;
    }, [contracts, selectedContractId]);

    const handleNewMessage = (updatedContract: Contract) => {
        setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
    };

    // Group contracts strictly by date (DD MMM YYYY) maintaining latest-first order
    const groupedContracts = useMemo(() => {
        const groups: Record<string, Contract[]> = {};

        filteredContracts.forEach((c) => {
            const rawDate = c.updated_at || c.created_at;
            let groupLabel = 'Lainnya';
            if (rawDate) {
                const dateObj = new Date(rawDate);
                groupLabel = dateObj.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            }

            if (!groups[groupLabel]) groups[groupLabel] = [];
            groups[groupLabel].push(c);
        });

        return groups;
    }, [filteredContracts]);

    return (
        <ToastProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-surface-muted/30 font-sans">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="Chat Center" />

                <div className="flex h-[calc(100vh-76px)] overflow-hidden font-sans p-4 gap-4 bg-slate-100/60 dark:bg-zinc-950">
                    {/* Sidebar: Floating Card Daftar Kontrak */}
                    <div className="flex w-80 flex-col rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md overflow-hidden shrink-0">
                        {/* Search & Header */}
                        <div className="px-3.5 py-3 border-b border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 h-[77px] flex flex-col justify-between shrink-0">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 shrink-0">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span>Percakapan</span>
                                </h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold shrink-0">
                                    {filteredContracts.length}
                                </span>
                            </div>
                            <SearchInput
                                placeholder="Cari kontrak..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-7 text-xs font-normal bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-slate-200 dark:border-zinc-700 rounded-lg"
                            />
                        </div>

                        {/* List items */}
                        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-1.5 space-y-1">
                            {filteredContracts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Search size={20} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-xs font-medium text-slate-500">Tidak ada kontrak</p>
                                </div>
                            ) : (
                                Object.entries(groupedContracts).map(([groupLabel, items]) => (
                                    <div key={groupLabel} className="space-y-1">
                                        <div className="sticky top-0 z-10 px-3 py-1.5 my-1.5 bg-slate-100/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between shadow-2xs">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={11} className="text-primary shrink-0" />
                                                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                                                    {groupLabel}
                                                </span>
                                            </div>
                                            <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-zinc-800">
                                                {items.length} Percakapan
                                            </span>
                                        </div>
                                        {items.map((c) => (
                                            <ContractListItem
                                                key={c.id}
                                                contract={c}
                                                isSelected={selectedContractId === c.id}
                                                onClick={() => setSelectedContractId(c.id)}
                                            />
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main: Floating Chat Area Card */}
                    <div className="flex-1 flex rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md overflow-hidden">
                        {selectedContract ? (
                            <>
                                <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                                    <div className="px-5 py-3 border-b border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between bg-slate-100/90 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 z-10 h-[77px] shrink-0 relative">
                                        {showChatSearch ? (
                                            <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                                                <SearchInput
                                                    placeholder="Cari dalam percakapan..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="h-9 flex-1 text-xs font-normal bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-slate-200 dark:border-zinc-700 rounded-xl"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowChatSearch(false); setSearch(''); }}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0"
                                                >
                                                    <X size={14} className="text-slate-500 dark:text-zinc-400" />
                                                    <span>Tutup</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                                                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center shrink-0 font-semibold border border-primary/20">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-0.5 min-w-0">
                                                            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight leading-none truncate">
                                                                {selectedContract.title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[9.5px] font-mono font-bold border border-slate-300/60 dark:border-zinc-600 shrink-0">
                                                                #{selectedContract.form_no || selectedContract.contract_no || 'DRAFT'}
                                                            </span>
                                                            <span className="text-slate-400 dark:text-zinc-600">•</span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Building2 size={11} className="text-slate-500 dark:text-zinc-400" />
                                                                {selectedContract.contract_type || 'General Contract'}
                                                            </span>
                                                            <span className="text-slate-400 dark:text-zinc-600">•</span>
                                                            <span className="truncate">Dibuat: <strong className="font-semibold text-slate-800 dark:text-zinc-200">{selectedContract.creator?.name || 'System'}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowChatSearch(true)}
                                                        title="Cari dalam chat"
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        <Search size={15} className="text-slate-500 dark:text-zinc-400" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/contracts/${selectedContract.id}`, '_blank')}
                                                        title="Buka Kontrak"
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0"
                                                    >
                                                        <ExternalLink size={15} className="text-slate-500 dark:text-zinc-400" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <ContractChat
                                            key={selectedContract.id}
                                            contract={selectedContract}
                                            meId={auth.user.id}
                                            onNewMessage={handleNewMessage}
                                        />
                                    </div>
                                </div>
                                {/* Right Panel: Member & Media */}
                                <ChatRightPanel contract={selectedContract} />
                            </>
                        ) : (
                            <>
                                <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                                    {/* Header for Empty State */}
                                    <div className="px-5 py-3 border-b border-primary/20 flex items-center justify-between bg-primary text-white z-10 h-[77px] shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 font-semibold border border-white/30">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-bold text-white tracking-tight leading-none mb-1">
                                                    Ruang Percakapan
                                                </h3>
                                                <p className="text-[11px] text-white/80">
                                                    Pilih percakapan untuk memulai diskusi
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-slate-500 bg-white/50 dark:bg-zinc-900/50">
                                        <div className="bg-primary/10 p-5 rounded-2xl text-primary border border-primary/20">
                                            <MessageSquare size={36} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-center max-w-xs px-4">
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight mb-1">Chat Center</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Pilih percakapan dari daftar kontrak di sebelah kiri untuk melihat pesan dan memulai diskusi.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Empty Right Panel: Informasi Percakapan */}
                                <div className="w-72 flex flex-col border-l border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 h-full overflow-hidden shrink-0">
                                    <div className="px-3.5 py-3 border-b border-primary/20 bg-primary text-white h-[77px] shrink-0 flex flex-col justify-between">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <Info size={14} className="text-white shrink-0" />
                                                <span>Informasi Percakapan</span>
                                            </h3>
                                        </div>
                                        <div className="flex gap-1 bg-white/10 p-0.5 rounded-lg border border-white/20">
                                            <div className="flex-1 py-1 px-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 bg-white text-primary shadow-xs">
                                                <Users size={12} />
                                                <span>Member (0)</span>
                                            </div>
                                            <div className="flex-1 py-1 px-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 text-white/80">
                                                <Paperclip size={12} />
                                                <span>Media (0)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2">
                                        <Info size={24} className="text-slate-300 dark:text-slate-700 stroke-1" />
                                        <p className="text-xs">Tidak ada informasi percakapan yang dipilih.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
        </ToastProvider>
    );
}

ChatPage.layout = (page: React.ReactNode) => <>{page}</>;
