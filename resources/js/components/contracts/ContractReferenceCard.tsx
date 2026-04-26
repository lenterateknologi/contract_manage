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
                params: { search: val, per_page: 5 }
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

    const inputCls = "w-full text-[12px] bg-slate-50/50 border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-all font-medium";

    return (
        <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border/50 flex items-center justify-between border-b p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                    <i className="fa-solid fa-link" /> Referensi Kontrak
                </div>
                {isDraft && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] font-bold text-primary hover:underline uppercase"
                    >
                        {parent ? 'Ganti' : 'Pilih'}
                    </button>
                )}
                {isEditing && (
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase"
                    >
                        Batal
                    </button>
                )}
            </div>

            <div className="p-4">
                {isEditing ? (
                    <div className="relative space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Cari No. Kontrak atau Judul..."
                                className={cn(inputCls, "pl-9")}
                            />
                        </div>

                        {isSearching && (
                            <div className="text-[10px] text-muted-foreground px-2">Mencari...</div>
                        )}

                        {results.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                {results.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelect(c)}
                                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-border last:border-0 transition-colors"
                                    >
                                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                                            {c.contract_no}
                                        </div>
                                        <div className="text-[12px] font-bold text-foreground line-clamp-1">
                                            {c.title}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {search.length >= 2 && !isSearching && results.length === 0 && (
                            <div className="text-[11px] text-muted-foreground p-2 italic text-center">
                                Kontrak tidak ditemukan
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {parent ? (
                            <div className="group relative">
                                <div className="space-y-1">
                                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10 }}>
                                        Kontrak Referensi
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-tight">
                                            {parent.contract_no}
                                        </span>
                                        <span className="text-[13px] font-bold text-foreground line-clamp-2 mt-0.5 leading-snug">
                                            {parent.title}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleRedirect}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                                    >
                                        <ExternalLink size={14} /> Lihat Detail
                                    </button>
                                    {isDraft && (
                                        <button
                                            onClick={handleRemove}
                                            className="w-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all active:scale-95"
                                            title="Hapus Referensi"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center border border-dashed border-border rounded-xl bg-slate-50/50">
                                <div className="text-[11px] font-medium text-muted-foreground">
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
                )}
            </div>
        </div>
    );
}
