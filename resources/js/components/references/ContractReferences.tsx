import { Button } from '@/components/ui/buttons/Button';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDateLong } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { ExternalLink, FileText, Link as LinkIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ContractReferencesProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
}

export default function ContractReferences({ contract, canUpdate, onUpdate, processing, meId }: ContractReferencesProps) {
    const parent = contract.parent;
    // ponytail: workflow configuration is the strict source of truth for references
    const allowReference = contract.allow?.reference ?? (contract as any).allow_reference ?? (contract.workflow_step as any)?.meta?.allow_reference;
    const isActor =
        (contract as any).can_approve ||
        (contract as any).is_current_actor ||
        contract.created_by === meId ||
        (contract as any).initiated_by_id === meId;
    const canModifyRef = allowReference === true && (isActor || canUpdate);

    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
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
            const res: any = await contractApi.references.search(contract.id, val);
            const list = res?.data || res || [];
            setResults(Array.isArray(list) ? list.filter((c: any) => c.id !== contract.id) : []);
        } catch (error) {
            console.error('Failed to search contract references', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = async (c: any) => {
        try {
            await contractApi.references.update(contract.id, c.id);
            await onUpdate({ parent_id: c.id });
        } catch (e) {
            console.error('Failed to update reference', e);
        } finally {
            setIsEditing(false);
            setSearch('');
            setResults([]);
        }
    };

    const handleRemove = async () => {
        try {
            await contractApi.references.update(contract.id, null);
            await onUpdate({ parent_id: null });
        } catch (e) {
            console.error('Failed to remove reference', e);
        }
    };

    const handleRedirect = () => {
        if (parent?.id) {
            window.location.href = route('contracts.show', parent.id);
        }
    };

    return (
        <div className="bg-surface-base flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:p-4">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <LinkIcon size={15} className="text-primary-foreground/90" />
                        <h4 className="text-primary-foreground text-xs font-semibold tracking-tight uppercase">Referensi Dokumen & Kontrak Induk</h4>
                        {parent && (
                            <span className="rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                1 Terhubung
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!parent && canModifyRef && !isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="text-primary flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold shadow-xs transition-all hover:bg-white/90"
                        >
                            <Plus size={13} />
                            <span>Hubungkan Kontrak</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={cn('custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-6', !parent && 'justify-center')}>
                <div className="relative">
                    {parent ? (
                        <div className="group border-border/80 from-card to-muted/20 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-2xs transition-all duration-300 hover:shadow-xs">
                            <div className="flex flex-col justify-between gap-6 md:flex-row">
                                <div className="flex flex-1 gap-4">
                                    <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                                        <FileText size={22} />
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                            <span className="text-muted-foreground font-mono text-[10px] font-bold uppercase">
                                                {parent.contract_no || parent.form_no || 'DRAFT'}
                                            </span>
                                            <span className="bg-border h-1 w-1 rounded-full" />
                                            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase shadow-2xs">
                                                {parent.status}
                                            </span>
                                        </div>
                                        <h4 className="text-foreground line-clamp-2 text-[14px] leading-snug font-bold tracking-tight">
                                            {parent.title}
                                        </h4>
                                        <div className="text-muted-foreground/80 mt-2 text-[10px] font-semibold uppercase">
                                            DIBUAT {formatDateLong(parent.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
                                    {canModifyRef && (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            variant="outline"
                                            className="border-border text-foreground h-9 gap-1.5 rounded-xl border px-4 text-[11px] font-bold shadow-2xs"
                                        >
                                            GANTI
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleRedirect}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 cursor-pointer gap-1.5 rounded-xl px-4 text-[11px] font-bold shadow-xs"
                                    >
                                        <ExternalLink size={13} strokeWidth={2.5} /> LIHAT DETAIL
                                    </Button>
                                    {canModifyRef && (
                                        <Button
                                            onClick={handleRemove}
                                            variant="ghost"
                                            className="text-muted-foreground h-9 w-9 rounded-xl p-0 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                                            title="Hapus Referensi"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in zoom-in-95 flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center duration-300">
                            <div className="bg-muted text-muted-foreground mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
                                <LinkIcon size={24} />
                            </div>
                            <h4 className="text-foreground text-[12px] font-bold uppercase">Tidak Ada Referensi</h4>
                            <p className="text-muted-foreground mt-1 max-w-[280px] text-xs leading-relaxed">
                                Kontrak ini tidak terhubung dengan referensi atau kontrak induk apa pun.
                            </p>
                            {canModifyRef && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4 h-8.5 cursor-pointer rounded-xl px-4 text-xs font-bold uppercase shadow-xs"
                                >
                                    Cari & Hubungkan Kontrak
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Search Dialog */}
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div
                            className="animate-in fade-in absolute inset-0 bg-slate-950/40 backdrop-blur-xs duration-300"
                            onClick={() => setIsEditing(false)}
                        />

                        <div className="animate-in zoom-in-95 border-border bg-card relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200">
                            <div className="border-border bg-card flex items-center justify-between border-b px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <Search size={16} className="text-primary" strokeWidth={3} />
                                    <h3 className="text-foreground text-xs font-bold tracking-wide uppercase">Hubungkan Kontrak Referensi</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(false)}
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-xl p-0"
                                >
                                    <X size={16} strokeWidth={3} />
                                </Button>
                            </div>

                            <div className="border-border bg-muted/20 border-b p-4">
                                <SearchInput
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="CARI BERDASARKAN NO. KONTRAK ATAU JUDUL..."
                                    className="h-10 text-xs uppercase"
                                />
                            </div>

                            <div className="custom-scrollbar min-h-[280px] flex-1 overflow-y-auto p-4">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <Loader2 className="text-primary mb-3 h-6 w-6 animate-spin" />
                                        <span className="text-muted-foreground text-xs font-semibold uppercase">Mencari Data Kontrak...</span>
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {results.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleSelect(c)}
                                                className="group hover:border-primary/40 hover:bg-primary/5 border-border/80 bg-card flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition-all hover:shadow-2xs"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-muted-foreground mb-0.5 font-mono text-[9px] font-bold tracking-tight uppercase">
                                                        {c.contract_no || c.form_no || 'NO NUMBER'}
                                                    </div>
                                                    <div className="text-foreground group-hover:text-primary line-clamp-1 text-xs font-bold transition-colors">
                                                        {c.title}
                                                    </div>
                                                    <div className="mt-1.5 flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'py-0.2 rounded px-2 text-[8.5px] font-bold uppercase',
                                                                c.status === 'approved'
                                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                                                    : 'text-muted-foreground bg-muted border-border border',
                                                            )}
                                                        >
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all">
                                                    <Plus size={13} strokeWidth={3} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : search.length >= 2 ? (
                                    <div className="flex flex-col items-center justify-center px-10 py-16 text-center">
                                        <Search size={28} className="text-muted-foreground mb-2.5 opacity-30" />
                                        <p className="text-foreground text-xs font-bold uppercase">Data Tidak Ditemukan</p>
                                        <p className="text-muted-foreground mt-1 text-[11px]">Pastikan kata kunci pencarian Anda benar.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center px-10 py-16 text-center">
                                        <LinkIcon size={28} className="text-muted-foreground mb-2.5 opacity-30" />
                                        <p className="text-muted-foreground text-xs font-semibold">Ketik minimal 2 karakter untuk mencari kontrak</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
