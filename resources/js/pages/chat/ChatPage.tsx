import { Head, router, usePage, usePoll } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ContractChat from '@/components/chat/ContractChat';
import { Contract } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { formatDate } from '@/lib/utils';
import { ContractListSidebar } from './components/ContractListSidebar';
import { ChatPageSkeleton } from '@/components/ui/feedback/ChatSkeleton';

interface Props {
    contracts: Contract[];
    initialContractId?: string;
    breadcrumbs: any[];
}

export default function ChatPage({ contracts: initialContracts = [], initialContractId }: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState('');
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedContractId, setSelectedContractId] = useState<string | null>(initialContractId || null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => setProcessing(true));
        const removeFinishListener = router.on('finish', () => setProcessing(false));

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    // Manage local contracts state to reflect new messages immediately
    const [contracts, setContracts] = useState(initialContracts);

    // Polling to fetch real-time updates for the involved contracts every 4 seconds
    usePoll(4000, { only: ['contracts'] });

    // Sync local contracts state when initialContracts updates via polling
    useEffect(() => {
        setContracts(initialContracts);
    }, [initialContracts]);

    // Mark contract chat as read on select, update URL state without full page reload
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
                        c.title?.toLowerCase().includes(s) ||
                        c.form_no?.toLowerCase().includes(s) ||
                        c.contract_no?.toLowerCase().includes(s);
                    if (!matchesSearch) return false;
                }
                if (dateFrom) {
                    const cDate = c.updated_at || c.created_at;
                    if (cDate && new Date(cDate) < new Date(dateFrom)) return false;
                }
                if (dateTo) {
                    const cDate = c.updated_at || c.created_at;
                    if (cDate && new Date(cDate) > new Date(`${dateTo}T23:59:59`)) return false;
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                return dateB - dateA;
            });
    }, [contracts, search, dateFrom, dateTo]);

    const selectedContract = useMemo(() => {
        return contracts.find((c) => c.id === selectedContractId) || null;
    }, [contracts, selectedContractId]);

    const handleNewMessage = (updatedContract: Contract) => {
        setContracts((prev) => prev.map((c) => (c.id === updatedContract.id ? updatedContract : c)));
    };

    // Group contracts strictly by date (DD MMM YYYY) maintaining latest-first order
    const groupedContracts = useMemo(() => {
        const groups: Record<string, Contract[]> = {};

        filteredContracts.forEach((c) => {
            const rawDate = c.updated_at || c.created_at;
            const groupLabel = rawDate ? formatDate(rawDate) : 'Lainnya';

            if (!groups[groupLabel]) groups[groupLabel] = [];
            groups[groupLabel].push(c);
        });

        return groups;
    }, [filteredContracts]);

    if (processing) {
        return (
            <div className="flex-1 flex h-[calc(100vh-64px)] w-full overflow-hidden">
                <Head title="Chat Center - Diskusi Kontrak" />
                <ChatPageSkeleton />
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-[calc(100vh-64px)] w-full overflow-hidden">
            <Head title="Chat Center - Diskusi Kontrak" />

            {/* Left Sidebar: Contract list & Filters */}
            <ContractListSidebar
                search={search}
                setSearch={setSearch}
                showChatSearch={showChatSearch}
                setShowChatSearch={setShowChatSearch}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                groupedContracts={groupedContracts}
                selectedContractId={selectedContractId}
                onSelectContract={(id) => setSelectedContractId(id)}
            />

            {/* Right Area: Chat Content View */}
            <div className="flex-1 flex flex-col h-full bg-background min-w-0 overflow-hidden">
                {selectedContract ? (
                    <ContractChat
                        key={selectedContract.id}
                        contract={selectedContract}
                        meId={auth?.user?.id}
                        onNewMessage={handleNewMessage}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
                        <div className="p-5 rounded-full bg-muted/60 text-muted-foreground">
                            <MessageSquare size={36} />
                        </div>
                        <div className="flex flex-col gap-1 max-w-sm">
                            <span className="text-sm font-bold text-foreground">Pilih Dokumen Percakapan</span>
                            <span className="text-xs leading-relaxed">
                                Pilih salah satu dokumen kontrak dari panel di sebelah kiri untuk membuka ruang diskusi dan riwayat pesan.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
