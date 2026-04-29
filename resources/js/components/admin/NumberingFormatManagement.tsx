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
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10 dark:shadow-white/5">
                        <Hash size={24} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 dark:text-white/40">Sistem Penomoran</h2>
                        <p className="text-[16px] font-bold text-black dark:text-white mt-0.5 tracking-tight">Konfigurasi Serial & Format Otomatis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}
                
                {formats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-xl">
                        <Hash className="h-12 w-12 text-black/10 dark:text-white/10 mb-4" />
                        <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.4em]">Struktur Penomoran Kosong</p>
                    </div>
                )}
            </div>

            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-lg p-8 flex gap-8 shadow-sm">
                <div className="p-3 rounded-lg bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10 dark:shadow-white/5 shrink-0 self-start">
                    <Info size={20} />
                </div>
                <div className="flex flex-col gap-4">
                    <span className="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Panduan Sintaks Placeholder</span>
                    <div className="text-[10px] text-black/40 dark:text-white/40 leading-relaxed font-bold uppercase tracking-widest grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{nomor}}"}</code> <span>Nomor urut otomatis</span></div>
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{tanggal}}"}</code> <span>Hari (01-31)</span></div>
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{bulan}}"}</code> <span>Bulan (01-12)</span></div>
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{tahun}}"}</code> <span>Tahun (YYYY)</span></div>
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{kode_departemen}}"}</code> <span>Kode Unit</span></div>
                        <div className="flex items-center gap-3"><code className="bg-black/[0.05] dark:bg-white/[0.05] text-black dark:text-white px-3 py-1 font-bold rounded-lg border border-black/[0.05] dark:border-white/[0.05]">{"{{kode_perjanjian}}"}</code> <span>Kode Tipe</span></div>
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
        <div className="bg-white dark:bg-black border border-black/[0.05] dark:border-white/[0.05] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="bg-black/[0.02] dark:bg-white/[0.02] px-8 py-5 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-center text-black/40 dark:text-white/40 rounded-lg">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-bold text-black dark:text-white uppercase tracking-widest">Modul: {format.module}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn("h-1.5 w-1.5 rounded-full", format.is_active ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10')} />
                            <span className="text-[9px] font-black text-black/30 dark:text-white/30 tracking-[0.2em] uppercase">
                                {format.is_active ? 'SISTEM AKTIF' : 'NON-AKTIF'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="h-9 px-6 rounded-lg border border-black/[0.1] dark:border-white/[0.1] text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all active:scale-95 shadow-sm"
                    >
                        Ubah Konfigurasi
                    </button>
                )}
            </div>

            <div className="p-8">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Pola Format (Pattern)</label>
                                <input
                                    type="text"
                                    value={data.format_pattern}
                                    onChange={e => setData('format_pattern', e.target.value)}
                                    className="h-10 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-5 text-[11px] font-black text-black dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-black dark:focus:border-white transition-all uppercase tracking-widest"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Index Terakhir</label>
                                <input
                                    type="number"
                                    value={data.current_number}
                                    onChange={e => setData('current_number', parseInt(e.target.value))}
                                    className="h-10 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-5 text-[12px] font-bold text-black dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-black dark:focus:border-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">Padding Digit</label>
                                <input
                                    type="number"
                                    value={data.padding}
                                    onChange={e => setData('padding', parseInt(e.target.value))}
                                    className="h-10 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-5 text-[12px] font-bold text-black dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-black dark:focus:border-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-8 border-t border-black/[0.05] dark:border-white/[0.05]">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); reset(); }}
                                className="h-10 px-8 rounded-lg text-[11px] font-black text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-all uppercase tracking-widest"
                            >
                                Batalkan Perubahan
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-10 px-10 rounded-lg bg-black dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-3 border-none shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95"
                            >
                                {processing ? <Save className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                Simpan Konfigurasi
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-4 block">Aktual Preview Format</span>
                            <div className="flex items-center gap-4 p-6 bg-black dark:bg-white text-white dark:text-black font-mono text-[14px] border-none rounded-xl shadow-xl shadow-black/10 dark:shadow-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Hash size={64} />
                                </div>
                                <span className="opacity-30 select-none font-black text-2xl">#</span>
                                <span className="font-bold tracking-[0.2em] truncate uppercase relative z-10">{format.format_pattern}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-black/[0.02] dark:bg-white/[0.02] p-6 border border-black/[0.05] dark:border-white/[0.05] rounded-xl shadow-sm">
                                <span className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Urutan Terakhir</span>
                                <span className="text-3xl font-bold text-black dark:text-white tabular-nums leading-none tracking-tighter">{format.current_number}</span>
                            </div>
                            <div className="bg-black/[0.02] dark:bg-white/[0.02] p-6 border border-black/[0.05] dark:border-white/[0.05] rounded-xl shadow-sm">
                                <span className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Digit Padding</span>
                                <span className="text-3xl font-bold text-black dark:text-white tabular-nums leading-none tracking-tighter">{format.padding} <span className="text-[12px] opacity-30 font-black ml-1 uppercase tracking-widest">Digit</span></span>
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
