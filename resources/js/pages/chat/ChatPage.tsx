import { AppSidebar } from '@/layouts/app/components/AppSidebar';
import { AppSidebarHeader } from '@/layouts/app/components/AppSidebarHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/navigation/Sidebar';
import { Head, usePage, usePoll } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Building2, ExternalLink, FileText, MessageSquare, Search } from 'lucide-react';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import ContractChat from '@/pages/contracts/components/tabs/ContractChat';
import { Contract } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { ContractListItem } from './ui/ContractListItem';
import { ToastProvider } from '@/components/ui/feedback/Toast';

interface Props {
    contracts: Contract[];
    initialContractId?: string;
    breadcrumbs: any[];
}

export default function ChatPage({ contracts: initialContracts, initialContractId, breadcrumbs }: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState('');
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

    // Memoize filtered contracts
    const filteredContracts = useMemo(() => {
        if (!search) return contracts;
        const s = search.toLowerCase();
        return contracts.filter(c =>
            c.title.toLowerCase().includes(s) ||
            c.form_no?.toLowerCase().includes(s) ||
            c.contract_no?.toLowerCase().includes(s)
        );
    }, [contracts, search]);

    const selectedContract = useMemo(() => {
        return contracts.find(c => c.id === selectedContractId) || null;
    }, [contracts, selectedContractId]);

    const handleNewMessage = (updatedContract: Contract) => {
        setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
    };

    // Group contracts by day based on updated_at or created_at
    const groupedContracts = useMemo(() => {
        const groups: Record<string, Contract[]> = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        filteredContracts.forEach((c) => {
            const rawDate = c.updated_at || c.created_at;
            let groupLabel = 'Lainnya';
            if (rawDate) {
                const dateObj = new Date(rawDate);
                const dateStr = dateObj.toDateString();
                if (dateStr === today) {
                    groupLabel = 'Hari Ini';
                } else if (dateStr === yesterday) {
                    groupLabel = 'Kemarin';
                } else {
                    groupLabel = dateObj.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    });
                }
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
                    <div className="flex w-80 flex-col rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm backdrop-blur-md overflow-hidden">
                        {/* Search & Header */}
                        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
                            <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span>Percakapan</span>
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {contracts.length}
                                </span>
                            </h2>
                            <SearchInput
                                placeholder="Cari kontrak..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8.5 text-xs font-normal bg-white dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700/80 rounded-xl"
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
                                        <div className="px-2.5 py-1">
                                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                {groupLabel}
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
                    <div className="flex-1 flex flex-col rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm backdrop-blur-md overflow-hidden">
                        {selectedContract ? (
                            <div className="flex flex-col h-full">
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/40 dark:bg-zinc-900/40 shadow-2xs z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold border border-primary/20">
                                            <FileText className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                                    {selectedContract.title}
                                                </h3>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9.5px] font-mono font-medium border border-slate-200 dark:border-slate-700">
                                                    #{selectedContract.form_no || selectedContract.contract_no || 'DRAFT'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Building2 size={11} className="text-slate-400" />
                                                    {selectedContract.contract_type || 'General Contract'}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span>Dibuat: <strong className="font-medium text-slate-700 dark:text-slate-300">{selectedContract.creator?.name || 'System'}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => window.open(`/contracts/${selectedContract.id}`, '_blank')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                        >
                                            <span>Buka Kontrak</span>
                                            <ExternalLink size={12} className="opacity-70" />
                                        </button>
                                    </div>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                                <div className="bg-primary/10 p-5 rounded-2xl text-primary border border-primary/20">
                                    <MessageSquare size={36} strokeWidth={1.5} />
                                </div>
                                <div className="text-center max-w-xs px-4">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight mb-1">Chat Center</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Pilih percakapan dari daftar kontrak di sebelah kiri untuk memulai diskusi.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
        </ToastProvider>
    );
}

ChatPage.layout = (page: React.ReactNode) => <>{page}</>;
