import ContractChat from '@/components/chat/ContractChat';
import { formatDate } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { Head, usePage } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContractListSidebar } from './components/ContractListSidebar';

interface Props {
    initialContractId?: string;
    breadcrumbs?: any[];
}

export default function ChatPage({ initialContractId }: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState('');
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeCategory, setActiveCategory] = useState<'all' | 'kontrak' | 'non_kontrak' | 'nda'>('all');
    const [selectedContractId, setSelectedContractId] = useState<string | null>(initialContractId || null);
    const [, setLoading] = useState(true);
    const [contracts, setContracts] = useState<any[]>([]);

    // Fetch discussions list 100% via REST API
    const fetchDiscussions = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res: any = await contractApi.discussions.list({
                page: 1,
                per_page: 100,
            });
            const list = Array.isArray(res) ? res : (res?.data ?? []);
            setContracts(list);
        } catch (e) {
            console.error('Failed to load discussions list', e);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchDiscussions();
    }, [fetchDiscussions]);

    // Background REST API polling every 5s
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDiscussions(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchDiscussions]);

    // Sync selectedContractId when initialContractId changes via navigation
    useEffect(() => {
        if (initialContractId && initialContractId !== selectedContractId) {
            setSelectedContractId(initialContractId);
        }
    }, [initialContractId]);

    // Auto-switch category if selected contract is not in the currently selected specific category
    useEffect(() => {
        if (selectedContractId && activeCategory !== 'all') {
            const found = contracts.find((c: any) => c.id === selectedContractId);
            if (found && (found as any).parent_category && (found as any).parent_category !== activeCategory) {
                setActiveCategory('all');
            }
        }
    }, [selectedContractId, contracts]);

    // Mark contract chat as read on select, update URL state without full page reload
    useEffect(() => {
        if (selectedContractId) {
            contractApi.messages.markRead(selectedContractId).catch(console.error);
            setContracts((prev) => prev.map((c) => (c.id === selectedContractId ? { ...c, unread_count: 0 } : c)));
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

    const safeContracts = useMemo(() => (Array.isArray(contracts) ? contracts : []), [contracts]);

    // Calculate category counts and unread badges
    const categoryCounts = useMemo(() => {
        const counts = {
            all: { total: safeContracts.length, unread: 0 },
            kontrak: { total: 0, unread: 0 },
            non_kontrak: { total: 0, unread: 0 },
            nda: { total: 0, unread: 0 },
        };
        safeContracts.forEach((c: any) => {
            if (!c) return;
            const cat = (c.parent_category || 'kontrak') as 'kontrak' | 'non_kontrak' | 'nda';
            const unread = c.unread_count || 0;
            counts.all.unread += unread;
            if (counts[cat]) {
                counts[cat].total++;
                counts[cat].unread += unread;
            }
        });
        return counts;
    }, [safeContracts]);

    // Memoize filtered contracts (Search text, Date range, and Category) sorted by latest updated_at first
    const filteredContracts = useMemo(() => {
        return safeContracts
            .filter((c: any) => {
                if (!c) return false;
                const cat = c.parent_category || 'kontrak';
                if (activeCategory !== 'all' && cat !== activeCategory) return false;
                if (search) {
                    const s = search.toLowerCase();
                    const matchesSearch =
                        c.title?.toLowerCase().includes(s) || c.form_no?.toLowerCase().includes(s) || c.contract_no?.toLowerCase().includes(s);
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
    }, [safeContracts, activeCategory, search, dateFrom, dateTo]);

    const selectedContract = useMemo(() => {
        return safeContracts.find((c) => c && c.id === selectedContractId) || null;
    }, [safeContracts, selectedContractId]);

    const handleNewMessage = (updatedContract: Contract) => {
        setContracts((prev) => (Array.isArray(prev) ? prev.map((c) => (c.id === updatedContract.id ? updatedContract : c)) : [updatedContract]));
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

    return (
        <div className="flex h-[calc(100vh-64px)] w-full flex-1 overflow-hidden">
            <Head title="Chat Center - Diskusi Kontrak" />

            {/* Left Sidebar: Contract list & Filters */}
            <ContractListSidebar
                search={search}
                setSearch={setSearch}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                categoryCounts={categoryCounts}
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
            <div className="bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                {selectedContract ? (
                    <ContractChat key={selectedContract.id} contract={selectedContract} meId={auth?.user?.id} onNewMessage={handleNewMessage} />
                ) : (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="bg-muted/60 text-muted-foreground rounded-full p-5">
                            <MessageSquare size={36} />
                        </div>
                        <div className="flex max-w-sm flex-col gap-1">
                            <span className="text-foreground text-sm font-bold">Pilih Dokumen Percakapan</span>
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
