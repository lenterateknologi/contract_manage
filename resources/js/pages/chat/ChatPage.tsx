import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/navigation/Sidebar';
import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import ContractChat from '@/components/contracts/tabs/ContractChat';
import { Contract } from '@/types/contracts';
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
            <SidebarInset className="bg-surface-muted/30">
                <AppHeader breadcrumbs={breadcrumbs} />
                <Head title="Chat Center" />
                
                <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                    {/* Sidebar: Daftar Kontrak */}
                    <div className="flex w-80 flex-col border-r border-surface-border bg-surface-base">
                        <div className="p-4 border-b border-surface-border">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                <MessageSquare size={16} /> Percakapan
                            </h2>
                            <SearchInput 
                                placeholder="Cari kontrak..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {filteredContracts.length === 0 ? (
                                <div className="p-8 text-center opacity-40">
                                    <Search size={24} className="mx-auto mb-2" />
                                    <p className="text-xs font-medium uppercase tracking-tight">Tidak ada kontrak</p>
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
                                <div className="p-4 border-b border-surface-border flex items-center justify-between bg-white dark:bg-zinc-900 shadow-sm z-10">
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black uppercase tracking-tight text-text-main leading-none mb-1">
                                            {selectedContract.title}
                                        </h3>
                                        <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest italic">
                                            Diskusi Kontrak {selectedContract.contract_no}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => window.open(`/contracts/${selectedContract.id}`, '_blank')}
                                            className="px-3 py-1.5 rounded-lg border border-surface-border text-[10px] font-black uppercase tracking-widest hover:bg-surface-muted transition-all"
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
                            <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                                <div className="bg-surface-muted p-6 rounded-full">
                                    <MessageSquare size={48} strokeWidth={1} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black uppercase tracking-widest">Chat Center</h3>
                                    <p className="text-xs font-bold uppercase tracking-tight">Pilih percakapan untuk memulai diskusi</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
