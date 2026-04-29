import React, { useState, useEffect } from 'react';
import { Contract } from '@/types/contracts';
import { cn } from '@/lib/utils';
import { ExternalLink, Search, X, Link as LinkIcon, Plus, Loader2, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';

interface ContractReferenceCardProps {
    selected: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
}

export function ContractReferenceCard({ 
    selected, 
    canUpdate, 
    onUpdate, 
    processing 
}: ContractReferenceCardProps) {
    const isDraft = selected.status === 'draft' && canUpdate;
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
                params: { search: val, per_page: 5, view: 'all' }
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
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">
            {!parent && isDraft && (
                <div className="flex justify-end">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="h-10 gap-2 text-black/60 dark:text-white/60 font-bold rounded-xl hover:bg-[#172554] hover:text-white dark:hover:bg-white dark:hover:text-[#172554] transition-all shadow-sm"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="text-[10px] uppercase tracking-widest">Hubungkan Kontrak</span>
                    </Button>
                </div>
            )}

            <div className="relative">
                {parent ? (
                    <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl overflow-hidden group transition-all">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 flex gap-5">
                                <div className="h-14 w-14 rounded-xl bg-white dark:bg-sidebar flex items-center justify-center text-black/20 dark:text-white/20 shrink-0 shadow-sm">
                                    <FileIcon size={24} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">
                                            {parent.contract_no || 'DRAFT'}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <span className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded shadow-sm">
                                            {parent.status}
                                        </span>
                                    </div>
                                    <h4 className="text-[15px] font-bold text-black dark:text-white leading-tight line-clamp-2 uppercase tracking-tight">
                                        {parent.title}
                                    </h4>
                                    <div className="mt-2 text-[10px] text-black/20 dark:text-white/20 font-bold uppercase tracking-widest">
                                        DIBUAT {new Date(parent.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {isDraft && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        className="h-9 px-4 gap-2 text-black/60 font-bold text-[11px] hover:bg-[#172554] hover:text-white rounded-lg transition-all active:scale-95 shadow-sm"
                                    >
                                        GANTI
                                    </Button>
                                )}
                                <Button
                                    onClick={handleRedirect}
                                    className="h-9 px-4 gap-2 bg-[#172554] dark:bg-white text-white dark:text-[#172554] font-bold text-[11px] hover:scale-95 rounded-lg transition-all shadow-lg shadow-[#172554]/10"
                                >
                                    <ExternalLink size={13} strokeWidth={2.5} /> LIHAT DETAIL
                                </Button>
                                {isDraft && (
                                    <Button
                                        onClick={handleRemove}
                                        variant="ghost"
                                        className="h-9 w-9 p-0 text-black/20 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95"
                                        title="Hapus Referensi"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl text-center animate-in zoom-in-95 duration-300">
                        <div className="h-16 w-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-black/10 dark:text-white/10 mb-6">
                            <LinkIcon size={24} />
                        </div>
                        <h4 className="text-[11px] font-bold text-black dark:text-white uppercase tracking-[0.3em] mb-2">Tidak Ada Referensi</h4>
                        <p className="text-[10px] text-black/40 dark:text-white/40 max-w-[240px] leading-relaxed font-bold uppercase tracking-widest">
                            Kontrak ini tidak terhubung dengan dokumen atau kontrak lama.
                        </p>
                        {isDraft && (
                            <Button 
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="mt-8 h-9 px-6 text-[10px] font-bold bg-[#172554] dark:bg-white text-white dark:text-[#172554] uppercase hover:scale-95 rounded-lg transition-all shadow-md"
                            >
                                Cari Kontrak Sekarang
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Search Dialog - Standardized Look */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div 
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsEditing(false)}
                    />
                    
                    <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Search size={16} className="text-slate-900" strokeWidth={3} />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Hubungkan Kontrak Lama</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 rounded-md"
                            >
                                <X size={16} strokeWidth={3} />
                            </Button>
                        </div>

                        <div className="p-5 border-b border-slate-100">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900 pointer-events-none transition-colors" />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="CARI BERDASARKAN NO. KONTRAK ATAU JUDUL..."
                                    className="w-full text-xs bg-slate-50 rounded-lg pl-11 pr-4 py-3 outline-none focus:bg-slate-100 transition-all font-bold uppercase tracking-widest placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[300px] p-2">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-900">
                                    <Loader2 className="animate-spin h-6 w-6 mb-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Searching Datastore...</span>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {results.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className="w-full text-left p-4 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center justify-between gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 font-mono">
                                                    {c.contract_no || 'NO NUMBER'}
                                                </div>
                                                <div className="text-[13px] font-bold text-slate-900 group-hover:text-black transition-colors line-clamp-1 uppercase">
                                                    {c.title}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                        c.status === 'approved' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                <Plus size={14} strokeWidth={3} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : search.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center px-10">
                                    <Search size={32} className="mb-4 opacity-10" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">DATA TIDAK DITEMUKAN</p>
                                    <p className="text-[10px] font-medium text-slate-300 mt-2">Pastikan kata kunci pencarian Anda benar.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-200 text-center px-10">
                                    <LinkIcon size={32} className="mb-4 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Siap Menghubungkan Kontrak</p>
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
