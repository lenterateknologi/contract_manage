import { Button } from '@/components/ui/base/Button';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { ExternalLink, Link as LinkIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ContractReferenceCardProps {
    selected: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
}

export function ContractReferenceCard({ selected, canUpdate, onUpdate, processing, meId }: ContractReferenceCardProps & { meId?: string }) {
    const parent = selected.parent;
    const isActor = (selected as any).can_approve || selected.created_by === meId;
    const canModifyRef = selected.allow_reference !== false && (isActor || canUpdate);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (debouncedSearch.length >= 2) {
            performSearch(debouncedSearch);
        } else {
            setResults([]);
        }
    }, [debouncedSearch]);

    const performSearch = async (val: string) => {
        setIsSearching(true);
        try {
            const res = await axios.get('/api/contracts', {
                params: { search: val, per_page: 5, view: 'all' },
            });
            setResults(res.data.data.filter((c: any) => c.id !== selected.id));
        } catch (error) {
            console.error('Failed to search contracts', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (c: any) => {
        onUpdate({ parent_id: c.id });
        setIsEditing(false);
        setSearch('');
        setResults([]);
    };

    const handleRemove = () => {
        onUpdate({ parent_id: null });
    };

    const handleRedirect = () => {
        if (parent) {
            window.location.href = route('contracts.show', parent.id);
        }
    };

    return (
        <div className={cn('animate-in fade-in flex flex-col gap-5 duration-500', !parent && 'flex-1 justify-center')}>
            {!parent && canModifyRef && <div className="flex justify-end"></div>}

            <div className="relative">
                {parent ? (
                    <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-white to-zinc-50/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-white/5 dark:from-slate-900/60 dark:to-slate-900/40">
                        <div className="flex flex-col justify-between gap-6 md:flex-row">
                            <div className="flex flex-1 gap-4">
                                <div className="bg-primary/10 text-primary dark:bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl dark:text-white">
                                    <FileIcon size={22} />
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                        <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-wider uppercase">
                                            {parent.contract_no || 'DRAFT'}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <span className="bg-primary/10 text-primary dark:bg-primary/20 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-sm dark:text-white">
                                            {parent.status}
                                        </span>
                                    </div>
                                    <h4 className="text-foreground line-clamp-2 text-[14px] leading-snug font-bold tracking-tight dark:text-white">
                                        {parent.title}
                                    </h4>
                                    <div className="text-muted-foreground/60 mt-2 text-[10px] font-semibold tracking-wider uppercase">
                                        DIBUAT{' '}
                                        {new Date(parent.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
                                {canModifyRef && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        className="text-foreground h-9 gap-2 rounded-xl border border-black/10 bg-white/50 px-4 text-[11px] font-bold shadow-sm backdrop-blur-sm transition-all hover:bg-black/5 active:scale-95 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-white/5"
                                    >
                                        GANTI
                                    </Button>
                                )}
                                <Button
                                    onClick={handleRedirect}
                                    className="bg-primary hover:bg-primary/90 h-9 gap-2 rounded-xl px-4 text-[11px] font-bold text-white shadow-lg transition-all hover:scale-95 active:scale-90"
                                >
                                    <ExternalLink size={13} strokeWidth={2.5} /> LIHAT DETAIL
                                </Button>
                                {canModifyRef && (
                                    <Button
                                        onClick={handleRemove}
                                        variant="ghost"
                                        className="h-9 w-9 rounded-xl p-0 text-black/20 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:text-white/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                        title="Hapus Referensi"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-black/[0.01] px-6 py-10 text-center duration-300 dark:border-white/10 dark:bg-white/[0.01]">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 text-black/20 dark:bg-white/5 dark:text-white/20">
                            <LinkIcon size={24} />
                        </div>
                        <h4 className="text-foreground text-[11px] font-bold tracking-wider dark:text-white">Tidak Ada Referensi</h4>
                        <p className="text-muted-foreground mt-1 max-w-[280px] text-[10px] leading-relaxed font-semibold">
                            Kontrak ini tidak terhubung dengan referensi apa pun.
                        </p>
                        {canModifyRef && (
                            <Button
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="bg-primary mt-4 h-9 rounded-xl px-5 text-[10px] font-bold text-white uppercase shadow-md transition-all hover:scale-95 active:scale-90"
                            >
                                Cari & Hubungkan Kontrak
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Search Dialog - Standardized Look */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="animate-in fade-in absolute inset-0 bg-slate-950/40 backdrop-blur-sm duration-300"
                        onClick={() => setIsEditing(false)}
                    />

                    <div className="animate-in zoom-in-95 relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl duration-200 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 dark:border-white/5 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <Search size={16} className="text-primary" strokeWidth={3} />
                                <h3 className="text-foreground text-[12px] font-bold tracking-wide dark:text-white">Hubungkan Kontrak Lama</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-xl p-0 hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <X size={16} strokeWidth={3} />
                            </Button>
                        </div>

                        <div className="border-b border-black/5 p-5 dark:border-white/5">
                            <div className="flex-1">
                                <SearchInput
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="CARI BERDASARKAN NO. KONTRAK ATAU JUDUL..."
                                    className="h-11 text-xs tracking-wider"
                                />
                            </div>
                        </div>

                        <div className="min-h-[300px] flex-1 overflow-y-auto bg-zinc-50/40 p-4 dark:bg-slate-900/40">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="text-primary mb-3 h-6 w-6 animate-spin" />
                                    <span className="text-muted-foreground text-[11px] font-semibold tracking-wider">Searching Datastore...</span>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {results.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className="group hover:border-primary/20 hover:bg-primary/[0.01] dark:hover:border-primary/20 dark:hover:bg-primary/[0.02] flex w-full items-center justify-between gap-4 rounded-xl border border-transparent bg-white p-4 text-left transition-all hover:shadow-sm dark:bg-slate-800/50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="text-muted-foreground/80 mb-1 font-mono text-[9px] font-bold tracking-tight uppercase">
                                                    {c.contract_no || 'NO NUMBER'}
                                                </div>
                                                <div className="text-foreground group-hover:text-primary line-clamp-1 text-[13px] font-bold transition-colors dark:text-white">
                                                    {c.title}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'rounded px-2.5 py-0.5 text-[8px] font-bold tracking-wider uppercase',
                                                            c.status === 'approved'
                                                                ? 'bg-primary text-white'
                                                                : 'text-muted-foreground bg-black/5 dark:bg-white/5',
                                                        )}
                                                    >
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-muted-foreground group-hover:bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/5 transition-all group-hover:text-white dark:bg-white/5">
                                                <Plus size={14} strokeWidth={3} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : search.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
                                    <Search size={32} className="text-muted-foreground mb-3 opacity-20" />
                                    <p className="text-foreground text-[12px] font-bold tracking-wide dark:text-white">DATA TIDAK DITEMUKAN</p>
                                    <p className="text-muted-foreground mt-1 text-[11px] font-medium">Pastikan kata kunci pencarian Anda benar.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
                                    <LinkIcon size={32} className="text-muted-foreground mb-3 opacity-20" />
                                    <p className="text-muted-foreground text-[11px] font-semibold">Siap Menghubungkan Kontrak</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FileIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
