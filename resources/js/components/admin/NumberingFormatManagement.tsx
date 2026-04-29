import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Hash, Save, Info, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberingFormat {
    id: string;
    module: string;
    format_pattern: string;
    current_number: number;
    padding: number;
    is_active: boolean;
}

interface Props {
    formats: NumberingFormat[];
}

export default function NumberingFormatManagement({ formats }: Props) {
    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-6">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 dark:text-white/40">Sistem Penomoran</h2>
                    <p className="text-[14px] font-black text-black dark:text-white mt-1 uppercase tracking-tight">Konfigurasi Serial & Format Otomatis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}
                
                {formats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-none">
                        <Hash className="h-10 w-10 text-black/20 dark:text-white/20 mb-4" />
                        <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.4em]">Struktur Penomoran Kosong</p>
                    </div>
                )}
            </div>

            <div className="bg-black/5 dark:bg-white/5 border border-black dark:border-white rounded-none p-8 flex gap-6">
                <Info className="h-6 w-6 text-black dark:text-white shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Panduan Sintaks Placeholder</span>
                    <div className="text-[10px] text-black/60 dark:text-white/60 leading-relaxed font-bold uppercase tracking-widest grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{nomor}}"}</code> <span>Nomor urut otomatis</span></div>
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{tanggal}}"}</code> <span>Hari (01-31)</span></div>
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{bulan}}"}</code> <span>Bulan (01-12)</span></div>
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{tahun}}"}</code> <span>Tahun (YYYY)</span></div>
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{kode_departemen}}"}</code> <span>Kode Unit</span></div>
                        <div className="flex items-center gap-2"><code className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-black">{"{{kode_perjanjian}}"}</code> <span>Kode Tipe</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormatCard({ format }: { format: NumberingFormat }) {
    const { data, setData, put, processing, reset } = useForm({
        format_pattern: format.format_pattern,
        current_number: format.current_number,
        padding: format.padding,
        is_active: format.is_active,
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.numbering-formats.update', format.id), {
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <div className="bg-white dark:bg-black border border-black dark:border-white rounded-none overflow-hidden transition-all duration-300">
            <div className="bg-black/5 dark:bg-white/5 px-6 py-4 border-b border-black dark:border-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black rounded-none">
                        <Hash size={20} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white">Modul: {format.module}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn("h-1.5 w-1.5 rounded-none", format.is_active ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20')} />
                            <span className="text-[8px] font-black text-black/40 dark:text-white/40 tracking-[0.2em] uppercase">
                                {format.is_active ? 'SISTEM AKTIF' : 'NON-AKTIF'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="h-8 px-6 rounded-none border border-black dark:border-white text-[9px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                    >
                        Ubah Konfigurasi
                    </button>
                )}
            </div>

            <div className="p-8">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Pola Format (Pattern)</label>
                                <input
                                    type="text"
                                    value={data.format_pattern}
                                    onChange={e => setData('format_pattern', e.target.value)}
                                    className="h-10 rounded-none border border-black dark:border-white bg-black/5 dark:bg-white/5 px-4 text-[11px] font-black text-black dark:text-white outline-none focus:bg-white dark:focus:bg-black transition-all uppercase tracking-widest"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Index Terakhir</label>
                                    <input
                                        type="number"
                                        value={data.current_number}
                                        onChange={e => setData('current_number', parseInt(e.target.value))}
                                        className="h-10 rounded-none border border-black dark:border-white bg-black/5 dark:bg-white/5 px-4 text-[11px] font-black text-black dark:text-white outline-none transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Padding Digit</label>
                                    <input
                                        type="number"
                                        value={data.padding}
                                        onChange={e => setData('padding', parseInt(e.target.value))}
                                        className="h-10 rounded-none border border-black dark:border-white bg-black/5 dark:bg-white/5 px-4 text-[11px] font-black text-black dark:text-white outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); reset(); }}
                                className="h-10 px-8 rounded-none text-[10px] font-black text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-all uppercase tracking-widest"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-10 px-10 rounded-none bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2 border border-black dark:border-white"
                            >
                                {processing ? <Save className="animate-spin h-3.5 w-3.5" /> : <Save size={14} />}
                                Simpan Data
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <span className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-3 block">Aktual Preview Format</span>
                            <div className="flex items-center gap-4 p-5 bg-black dark:bg-white text-white dark:text-black font-mono text-[13px] border border-black dark:border-white relative overflow-hidden group">
                                <span className="opacity-20 select-none font-black text-xl">#</span>
                                <span className="font-black tracking-[0.1em] truncate uppercase">{format.format_pattern}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/5 dark:bg-white/5 p-5 border border-black dark:border-white rounded-none">
                                <span className="text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Urutan Terakhir</span>
                                <span className="text-2xl font-black text-black dark:text-white tabular-nums leading-none tracking-tighter">{format.current_number}</span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 p-5 border border-black dark:border-white rounded-none">
                                <span className="text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Digit Padding</span>
                                <span className="text-2xl font-black text-black dark:text-white tabular-nums leading-none tracking-tighter">{format.padding} <span className="text-[10px] opacity-40 ml-1">DG</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mock route helper if not defined (though it should be from Ziggy)
declare var route: any;
