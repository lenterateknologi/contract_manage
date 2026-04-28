import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract } from '@/types/contracts';
import { cn } from '@/lib/utils';
import { ExternalLink, Search, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

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
            // Use the correct API endpoint for searching contracts
            const res = await axios.get('/api/contracts', {
                params: { search: val, per_page: 5, view: 'all' }
            });
            // Filter out current contract
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
            router.get(route('contracts.show', parent.id));
        }
    };

    return (
        <>
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
                <div className="border-border/50 flex items-center justify-between border-b p-3.5 bg-slate-50/50">
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em]">
                        <i className="fa-solid fa-link text-primary" /> Referensi Kontrak
                    </div>
                    {isDraft && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase"
                        >
                            {parent ? 'Ganti' : 'Pilih'}
                        </button>
                    )}
                </div>

                <div className="p-4">
                    <div className="space-y-4">
                        {parent ? (
                            <div className="group relative">
                                <div className="space-y-1">
                                    <div className="text-slate-400 font-bold tracking-widest uppercase mb-1" style={{ fontSize: 9 }}>
                                        Kontrak Referensi
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-tight">
                                            {parent.contract_no || 'NO NUMBER'}
                                        </span>
                                        <span className="text-[13px] font-bold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                                            {parent.title}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleRedirect}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                                    >
                                        <ExternalLink size={13} /> Lihat Detail
                                    </button>
                                    {isDraft && (
                                        <button
                                            onClick={handleRemove}
                                            className="w-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all active:scale-95"
                                            title="Hapus Referensi"
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="text-[11px] font-medium text-slate-400">
                                    Belum ada referensi kontrak lama
                                </div>
                                {isDraft && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="mt-2 text-[10px] font-bold text-primary uppercase hover:underline"
                                    >
                                        Hubungkan Sekarang
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog Pencarian */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsEditing(false)}
                    />
                    
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Search size={16} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Cari Kontrak Lama</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Cari berdasarkan No. Kontrak atau Judul</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Ketik minimal 2 karakter..."
                                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                            {isSearching && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                                    <i className="fa-solid fa-spinner fa-spin text-2xl mb-2" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Mencari Data...</span>
                                </div>
                            )}

                            {!isSearching && results.length > 0 && (
                                <div className="space-y-1">
                                    {results.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className="w-full text-left p-4 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="text-[10px] font-bold text-primary uppercase tracking-tight mb-1 flex items-center gap-1.5 font-mono">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                        {c.contract_no || 'NO NUMBER'}
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                                        {c.title}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">
                                                            {c.status}
                                                        </span>
                                                        <span className="text-[9px] text-slate-300 font-medium">
                                                            Dibuat: {c.created_at}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <ExternalLink size={14} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {!isSearching && search.length >= 2 && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-300 italic">
                                    <Search size={32} className="mb-3 opacity-20" />
                                    <span className="text-xs">Kontrak tidak ditemukan</span>
                                </div>
                            )}

                            {search.length < 2 && !isSearching && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-200">
                                    <i className="fa-solid fa-magnifying-glass text-3xl mb-3 opacity-30" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Siap Mencari Referensi</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
