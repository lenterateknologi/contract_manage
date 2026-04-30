import { Button } from '@/components/ui/base/Button';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { ExternalLink, Link as LinkIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface ContractReferenceCardProps {
    selected: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
}

export function ContractReferenceCard({ selected, canUpdate, onUpdate, processing }: ContractReferenceCardProps) {
    const canModifyRef = selected.allow_reference && canUpdate;
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const parent = selected.parent;

    const handleSearch = async (val: string) => {
        setSearch(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
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
        <div className="animate-in fade-in flex flex-col gap-6 duration-500">
            {!parent && canModifyRef && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-10 gap-2 rounded-xl border-black/10 font-bold text-black shadow-sm transition-all hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="text-[10px] tracking-widest uppercase">Hubungkan Kontrak</span>
                    </Button>
                </div>
            )}

            <div className="relative">
                {parent ? (
                    <div className="group overflow-hidden rounded-xl bg-black/[0.03] transition-all dark:bg-white/[0.03]">
                        <div className="flex flex-col justify-between gap-4 p-4">
                            <div className="flex flex-1 gap-5">
                                <div className="flex min-w-0 flex-col">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                            {parent.contract_no || 'DRAFT'}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <span className="rounded bg-black/5 px-2 py-0.5 text-[9px] font-bold tracking-widest text-black/60 uppercase shadow-sm dark:bg-white/5 dark:text-white/60">
                                            {parent.status}
                                        </span>
                                    </div>
                                    <h4 className="line-clamp-2 text-[13px] leading-tight font-bold tracking-tight text-black uppercase dark:text-white">
                                        {parent.title}
                                    </h4>
                                    <div className="mt-2 text-[10px] font-bold tracking-widest text-black/20 uppercase dark:text-white/20">
                                        DIBUAT{' '}
                                        {new Date(parent.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {canModifyRef && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        className="h-9 gap-2 rounded-lg border-black/10 px-4 text-[11px] font-bold text-black shadow-sm transition-all hover:bg-black/5 active:scale-95 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                                    >
                                        GANTI
                                    </Button>
                                )}
                                <Button
                                    onClick={handleRedirect}
                                    className="h-9 gap-2 rounded-lg bg-black px-4 text-[11px] font-bold text-white shadow-lg transition-all hover:scale-95 dark:bg-white dark:text-black"
                                >
                                    <ExternalLink size={13} strokeWidth={2.5} /> LIHAT DETAIL
                                </Button>
                                {canModifyRef && (
                                    <Button
                                        onClick={handleRemove}
                                        variant="ghost"
                                        className="h-9 w-9 rounded-lg p-0 text-black/20 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                        title="Hapus Referensi"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 flex flex-col items-center justify-center rounded-xl bg-black/[0.03] px-4 py-3 text-center duration-300 dark:bg-white/[0.03]">
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-black/10 dark:bg-white/5 dark:text-white/10">
                            <LinkIcon size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold tracking-[0.3em] text-black uppercase dark:text-white">Tidak Ada Referensi</h4>
                        <p className="max-w-[200px] text-[9px] leading-relaxed font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                            Kontrak ini tidak terhubung dengan referensi.
                        </p>
                        {canModifyRef && (
                            <Button
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="mt-2 h-8 rounded-lg bg-black px-4 text-[9px] font-bold text-white uppercase shadow-md transition-all hover:scale-95 dark:bg-white dark:text-black"
                            >
                                Cari Kontrak
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

                    <div className="dark:bg-sidebar animate-in zoom-in-95 relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl duration-200 dark:border-white/10">
                        <div className="dark:bg-sidebar flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
                            <div className="flex items-center gap-3">
                                <Search size={16} className="text-black dark:text-white" strokeWidth={3} />
                                <h3 className="text-[11px] font-black tracking-widest text-black uppercase dark:text-white">
                                    Hubungkan Kontrak Lama
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="h-8 w-8 rounded-md p-0 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                            >
                                <X size={16} strokeWidth={3} />
                            </Button>
                        </div>

                        <div className="border-b border-black/5 p-5">
                            <div className="flex-1">
                                <SearchInput
                                    autoFocus
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="CARI BERDASARKAN NO. KONTRAK ATAU JUDUL..."
                                    className="h-11 text-xs tracking-widest uppercase"
                                />
                            </div>
                        </div>

                        <div className="min-h-[300px] flex-1 overflow-y-auto p-2">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="mb-3 h-6 w-6 animate-spin text-black dark:text-white" />
                                    <span className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Searching Datastore...
                                    </span>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {results.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-transparent p-4 text-left transition-all hover:border-black/5 hover:bg-black/[0.02] dark:hover:border-white/5 dark:hover:bg-white/[0.02]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 font-mono text-[9px] font-black tracking-tight text-black/40 uppercase dark:text-white/40">
                                                    {c.contract_no || 'NO NUMBER'}
                                                </div>
                                                <div className="line-clamp-1 text-[13px] font-bold text-black uppercase transition-colors group-hover:text-black dark:text-white dark:group-hover:text-white">
                                                    {c.title}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'rounded px-2 py-0.5 text-[8px] font-black tracking-widest uppercase',
                                                            c.status === 'approved'
                                                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                                                : 'bg-black/5 text-black/40 dark:bg-white/5 dark:text-white/40',
                                                        )}
                                                    >
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black/5 text-black/20 transition-all group-hover:bg-black group-hover:text-white dark:bg-white/5 dark:text-white/20 dark:group-hover:bg-white dark:group-hover:text-black">
                                                <Plus size={14} strokeWidth={3} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : search.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
                                    <Search size={32} className="mb-4 text-black opacity-10 dark:text-white" />
                                    <p className="text-[11px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        DATA TIDAK DITEMUKAN
                                    </p>
                                    <p className="mt-2 text-[10px] font-bold tracking-widest text-black/20 uppercase dark:text-white/20">
                                        Pastikan kata kunci pencarian Anda benar.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
                                    <LinkIcon size={32} className="mb-4 text-black opacity-10 dark:text-white" />
                                    <p className="text-[10px] font-black tracking-widest text-black/20 uppercase dark:text-white/20">
                                        Siap Menghubungkan Kontrak
                                    </p>
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
