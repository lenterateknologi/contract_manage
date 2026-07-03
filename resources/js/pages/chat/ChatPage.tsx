import { AppSidebar } from '@/layouts/app/components/AppSidebar';
import { AppSidebarHeader } from '@/layouts/app/components/AppSidebarHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/navigation/Sidebar';
import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import ContractChat from '@/pages/contracts/components/tabs/ContractChat';
import { Contract } from '@/pages/contracts/types';
import { ContractListItem } from './ui/ContractListItem';

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

    // Memoize filtered contracts
    const filteredContracts = useMemo(() => {
        if (!search) return contracts;
        const s = search.toLowerCase();
        return contracts.filter(c =>
            c.title.toLowerCase().includes(s) ||
            c.contract_no?.toLowerCase().includes(s)
        );
    }, [contracts, search]);

    const selectedContract = useMemo(() => {
        return contracts.find(c => c.id === selectedContractId) || null;
    }, [contracts, selectedContractId]);

    const handleNewMessage = (updatedContract: Contract) => {
        setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-surface-muted/30 font-sans">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="Chat Center" />

                <div className="flex h-[calc(100vh-84px)] overflow-hidden font-sans">
                    {/* Sidebar: Daftar Kontrak */}
                    <div className="flex w-80 flex-col border-r border-surface-border bg-surface-base">
                        <div className="p-4 border-b border-primary/20 bg-primary! text-white" style={{ backgroundColor: 'var(--primary)' }}>
                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase">
                                <MessageSquare className="h-4 w-4 text-white" /> Percakapan
                            </h2>
                             <SearchInput
                                placeholder="Cari kontrak..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 text-xs bg-white text-text-main placeholder:text-text-soft/60 border-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:border-white focus-visible:ring-offset-0 dark:bg-white dark:text-text-main dark:placeholder:text-text-soft/60"
                                containerClassName="[&_svg]:text-text-soft [&_svg]:group-focus-within:text-primary"
                             />
                        </div>

                        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {filteredContracts.length === 0 ? (
                                <div className="p-8 text-center opacity-40">
                                    <Search size={24} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tidak ada kontrak</p>
                                </div>
                            ) : (
                                filteredContracts.map(c => (
                                    <ContractListItem
                                        key={c.id}
                                        contract={c}
                                        isSelected={selectedContractId === c.id}
                                        onClick={() => setSelectedContractId(c.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main: Chat Area */}
                    <div className="flex-1 flex flex-col bg-surface-base">
                        {selectedContract ? (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-primary! text-white shadow-sm z-10" style={{ backgroundColor: 'var(--primary)' }}>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-white leading-none mb-1 uppercase">
                                            {selectedContract.title}
                                        </h3>
                                        <p className="text-xs text-white/70">
                                            Diskusi Kontrak {selectedContract.contract_no}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => window.open(`/contracts/${selectedContract.id}`, '_blank')}
                                            className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-all"
                                        >
                                            Buka Kontrak
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
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-text-soft/60">
                                <div className="bg-surface-muted p-6 rounded-full text-text-soft/40">
                                    <MessageSquare size={48} strokeWidth={1.5} />
                                </div>
                                <div className="text-center max-w-xs px-4">
                                    <h3 className="text-base font-semibold text-text-main tracking-tight mb-1">Chat Center</h3>
                                    <p className="text-xs text-text-soft leading-relaxed">
                                        Pilih percakapan dari daftar kontrak untuk memulai diskusi dan kolaborasi.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

ChatPage.layout = (page: React.ReactNode) => <>{page}</>;
