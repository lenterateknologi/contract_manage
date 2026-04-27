import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Hash, Save, Info, Check, X, AlertCircle } from 'lucide-react';

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
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Pengaturan Penomoran</h2>
                    <p className="text-xs text-slate-500 mt-1">Konfigurasi format nomor otomatis untuk berbagai modul sistem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {formats.map((format) => (
                    <FormatCard key={format.id} format={format} />
                ))}
                
                {formats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Hash className="h-10 w-10 text-slate-200 mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada format terdaftar</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Panduan Placeholder</span>
                    <p className="text-[11px] text-blue-600/80 leading-relaxed font-medium">
                        Gunakan tag berikut untuk menyusun format: <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{nomor}}"}</code> - Nomor urut otomatis (misal: 001) <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{tanggal}}"}</code> - Hari saat ini (01-31) <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{bulan}}"}</code> - Bulan saat ini (01-12) <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{tahun}}"}</code> - Tahun saat ini (YYYY) <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{kode_departemen}}"}</code> - Kode dari departemen pembuat <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{kode_perjanjian}}"}</code> - Kode dari tipe kontrak <br/>
                        <code className="bg-blue-100 px-1 rounded font-bold">{"{{CMS}}"}</code> - Teks statis "CMS"
                    </p>
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                        <Hash size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Modul: {format.module}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${format.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                {format.is_active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="h-9 px-4 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Ubah Format
                    </button>
                )}
            </div>

            <div className="p-6">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pola Format (Pattern)</label>
                                <input
                                    type="text"
                                    value={data.format_pattern}
                                    onChange={e => setData('format_pattern', e.target.value)}
                                    className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Terakhir</label>
                                    <input
                                        type="number"
                                        value={data.current_number}
                                        onChange={e => setData('current_number', parseInt(e.target.value))}
                                        className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Padding (Digit)</label>
                                    <input
                                        type="number"
                                        value={data.padding}
                                        onChange={e => setData('padding', parseInt(e.target.value))}
                                        className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); reset(); }}
                                className="h-10 px-6 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-10 px-8 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {processing ? <Save className="animate-spin h-3.5 w-3.5" /> : <Save size={14} />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Format Saat Ini</span>
                            <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-900 text-white font-mono text-sm border-2 border-slate-800 shadow-xl overflow-hidden relative group">
                                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-800/50 to-transparent pointer-events-none" />
                                <span className="opacity-40 select-none">#</span>
                                <span className="font-bold tracking-widest truncate">{format.format_pattern}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Terakhir</span>
                                <span className="text-xl font-black text-slate-800 tabular-nums">{format.current_number}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Padding</span>
                                <span className="text-xl font-black text-slate-800 tabular-nums">{format.padding} Digit</span>
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
